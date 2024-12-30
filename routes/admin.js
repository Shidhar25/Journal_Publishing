import express from 'express';
import { db } from '../config/firebase.js';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userRef = doc(db, 'users', req.session.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists() || !userSnap.data().isAdmin) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all research papers
router.get('/papers', isAdmin, async (req, res) => {
    try {
        const papersRef = collection(db, 'papers');
        const snapshot = await getDocs(papersRef);
        const papers = [];
        
        snapshot.forEach(doc => {
            papers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(papers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const users = [];
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                email: userData.email,
                name: userData.name,
                papersCount: userData.papersCount || 0
            });
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Delete a paper
router.delete('/papers/:paperId', isAdmin, async (req, res) => {
    try {
        const { paperId } = req.params;
        await deleteDoc(doc(db, 'papers', paperId));
        res.json({ message: 'Paper deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete paper' });
    }
});

// Get papers by user
router.get('/users/:userId/papers', isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const papersRef = collection(db, 'papers');
        const q = query(papersRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        const papers = [];
        snapshot.forEach(doc => {
            papers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json(papers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user papers' });
    }
});

export default router; 