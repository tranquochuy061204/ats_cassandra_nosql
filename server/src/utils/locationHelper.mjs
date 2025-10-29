import client from '../config/cassandra.mjs';
import { types } from 'cassandra-driver';

/**
 * Trả về tên tỉnh/thành theo mã province_code
 * @param {string|number} code - Mã tỉnh (ví dụ '79')
 * @returns {Promise<string|null>} - Tên tỉnh hoặc null nếu không tìm thấy
 */
export async function getProvinceName(code) {
  if (!code) return null;

  try {
    // ⚡️ Nếu code là số → convert về string
    const normalizedCode = String(code).trim();

    const result = await client.execute('SELECT name FROM vn_provinces WHERE code = ? LIMIT 1', [normalizedCode], {
      prepare: true,
    });

    if (result.rowLength === 0) return null;

    return result.first().name;
  } catch (err) {
    console.error('❌ Lỗi trong getProvinceName:', err);
    return null;
  }
}

/**
 * Trả về tên quận/huyện theo mã district_code
 */
export async function getDistrictName(code) {
  if (!code) return null;

  try {
    const normalizedCode = String(code).trim();

    const result = await client.execute('SELECT name FROM districts WHERE code = ? LIMIT 1', [normalizedCode], {
      prepare: true,
    });

    console.log(result);

    if (result.rowLength === 0) return null;

    return result.first().name;
  } catch (err) {
    console.error('❌ Lỗi trong getDistrictName:', err);
    return null;
  }
}
