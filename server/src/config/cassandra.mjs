import cassandra from 'cassandra-driver';

const client = new cassandra.Client({
  contactPoints: [process.env.CASS_HOST || '127.0.0.1'],
  localDataCenter: process.env.CASS_DC || 'datacenter1',
  protocolOptions: { port: Number(process.env.CASS_PORT || 9042) },
  keyspace: process.env.CASS_KEYSPACE || 'nosql',
});

export async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Cassandra connected!');
  } catch (err) {
    console.error('❌ Cassandra connection error:', err);
  }
}

export default client;
