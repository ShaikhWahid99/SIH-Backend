const neo4j = require('neo4j-driver');
const config = require('./env');

let driver = null;

async function connectNeo4j() {
  const { uri, username, password } = config.neo4j || {};

  if (!uri || !username || !password) {
    console.warn('Neo4j config missing. Skipping Neo4j connection.');
    return null;
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  await driver.verifyConnectivity();
  console.log('Neo4j connected');
  return driver;
}

function getDriver() {
  return driver;
}

function getSession(database = config.neo4j?.database || 'neo4j') {
  if (!driver) throw new Error('Neo4j driver not initialized');
  return driver.session({ database });
}

async function closeNeo4j() {
  if (driver) {
    await driver.close();
    console.log('Neo4j connection closed');
  }
}

module.exports = { connectNeo4j, getDriver, getSession, closeNeo4j };
