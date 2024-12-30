import { BlobServiceClient } from '@azure/storage-blob';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Global service clients
let containerClient = null;
let mongoClient = null;

// Initialize Services
export async function initializeServices() {
    try {
        // Initialize MongoDB
        console.log('Connecting to MongoDB...');
        const mongodbUri = process.env.MONGODB_URI;
        if (!mongodbUri) {
            throw new Error('Missing MongoDB URI');
        }
        
        mongoClient = new MongoClient(mongodbUri, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            connectTimeoutMS: 5000
        });
        await mongoClient.connect();
        await mongoClient.db('admin').command({ ping: 1 }); // Test the connection
        console.log('MongoDB connected successfully');

        // Initialize Azure Blob Storage
        try {
            console.log('Initializing Azure Blob Storage...');
            const accountName = process.env.ACCOUNT_NAME;
            const sasToken = process.env.SAS_TOKEN;
            const containerName = process.env.CONTAINER_NAME;
            
            if (accountName && sasToken && containerName) {
                const blobServiceClient = new BlobServiceClient(
                    `https://${accountName}.blob.core.windows.net/?${sasToken}`
                );
                containerClient = blobServiceClient.getContainerClient(containerName);
                await containerClient.getProperties(); // Test the connection
                console.log('Azure Blob Storage initialized successfully');
            } else {
                console.warn('Azure Storage configuration missing - File upload feature will be disabled');
            }
        } catch (storageError) {
            console.warn('Azure Blob Storage initialization failed:', storageError.message);
            console.warn('File upload feature will be disabled');
        }

        return { containerClient, mongoClient };
    } catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
}

// File upload helpers
export async function extractMetadata(headers) {
    const contentType = headers['content-type'];
    const fileType = contentType.split('/')[1];
    const contentDisposition = headers['content-disposition'];
    const caption = headers['x-image-caption'] || 'No caption provided';
    const matches = /filename="([^"]+)/i.exec(contentDisposition);
    const filename = matches?.[1] || `image-${Date.now()}.${fileType}`;

    return { filename, caption, fileType };
}

export async function uploadImageStream(blobName, dataStream) {
    if (!containerClient) {
        throw new Error('Storage service not initialized');
    }
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.uploadStream(dataStream);
    return blobClient.url;
}

export async function storeMetadata(name, caption, fileType, imageUrl) {
    if (!mongoClient) {
        throw new Error('Database service not initialized');
    }
    const collection = mongoClient.db('images').collection('metadata');
    await collection.insertOne({ name, caption, fileType, imageUrl });
}

// Cleanup function
export async function closeConnections() {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
} 