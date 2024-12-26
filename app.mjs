import http from 'http'
import { BlobServiceClient } from '@azure/storage-blob'
import { MongoClient } from 'mongodb'
import 'dotenv/config'

const mongodbUri = process.env.MONGODB_URI;
const accountName = process.env.ACCOUNT_NAME;
const sasToken = process.env.SAS_TOKEN;
const containerName = process.env.CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
const containerClient = blobServiceClient.getContainerClient(containerName);

const client = new MongoClient(mongodbUri);
client.connect();

const server = http.createServer(handelImageUpload);
const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

async function extractMetadata(headers) {
    const contentType = headers['content-type'];
    const fileType = contentType.split('/')[1];
    const contentDisposition = headers['content-disposition'];
    const caption = headers['x-image-caption'] || 'No caption provided';
    const matches = /filename="([^"]+)/i.exec(contentDisposition);
    const filename = matches?.[1] || `image-${Date.now()}.${fileType}`;

    return {filename, caption, fileType};
}

async function uploadImageStream(blobName, dataStream) {
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.uploadStream(dataStream);
    return blobClient.url;
}

async function storeMetadata(name, caption, fileType, imageUrl) {
    const collection = client.db('images').collection('metadata');
    await collection.insertOne({name, caption, fileType, imageUrl});
}

async function handelImageUpload(req, res) {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/api/upload' && req.method === 'POST') {
        try {
            const { filename, caption, fileType } = await extractMetadata(req.headers);
            const imageUrl = await uploadImageStream(filename, req);
            await storeMetadata(filename, caption, fileType, imageUrl);
            res.writeHead(201);
            res.end(JSON.stringify({ message: 'Image uploaded successfully' }));
        } catch (error) {
            console.log(error);
            res.writeHead(500);
            res.end(JSON.stringify({ message: 'Internal server error' }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
}
