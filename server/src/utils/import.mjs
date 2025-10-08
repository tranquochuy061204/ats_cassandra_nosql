import axios from 'axios';
import client from '../config/cassandra.mjs';
async function fetchAllProvincesWithDistricts() {
  const url = 'https://provinces.open-api.vn/api/v1/?depth=2';
  const resp = await axios.get(url);
  return resp.data; // đây sẽ là array các tỉnh có trường districts
}

async function importToCassandra(session) {
  const provinces = await fetchAllProvincesWithDistricts();
  for (const prov of provinces) {
    const provCode = prov.code.toString(); // hoặc để nguyên số, tùy bạn dùng TEXT hay INT
    const provName = prov.name;

    // Insert tỉnh
    await session.execute('INSERT INTO vn_provinces (code, name) VALUES (?, ?)', [provCode, provName], {
      prepare: true,
    });

    // Insert quận/huyện
    if (prov.districts) {
      for (const dist of prov.districts) {
        const distCode = dist.code.toString();
        const distName = dist.name;
        await session.execute(
          'INSERT INTO districts (province_code, code, name) VALUES (?, ?, ?)',
          [provCode, distCode, distName],
          { prepare: true }
        );
      }
    }
  }
}

importToCassandra(client);
