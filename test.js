// mongodb+srv://himanshu1242be23:<db_password>@cluster0.g4ydm.mongodb.net/?appName=Cluster0


import { MongoClient } from "mongodb";

const uri = "mongodb+srv://himanshu1242be23:Atlas_5002@cluster0.g4ydm.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected Successfully!");
  } catch (err) {
    console.error("Connection Failed:", err);
  } finally {
    await client.close();
  }
}

run();
