// --- Imports (ESM Syntax) ---
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
// ESM specific for __dirname equivalent
import { fileURLToPath } from 'url';

// Load environment variables immediately
dotenv.config();

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3001;
const API_BASE_URL = '/api';

// --- File Upload Setup (Multer) ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const userId = req.user ? req.user._id : 'anon';
        cb(null, `${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports images (jpg/jpeg/png/gif)"));
    }
});
// --- End Multer Setup ---

// --- Middleware ---
// Configure CORS to accept local frontend and production frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', // backup local
    process.env.FRONTEND_URL
].filter(Boolean); // remove undefined

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));


// --- Mongoose Schemas & Models ---
// 1. User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Donor', 'Receiver', 'Admin'], required: true },
    location: { type: String }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        console.error("Error during password hashing:", err);
        next(err);
    }
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// 2. Food Listing Schema
const FoodListingSchema = new mongoose.Schema({
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    donorName: { type: String, required: true },
    category: { type: String, enum: ['Cooked Meal', 'Groceries', 'Fruits & Vegetables', 'Bakery', 'Dairy', 'Beverages', 'Other'], default: 'Other' },
    description: { type: String, required: true },
    quantity: { type: String, required: true },
    location: { type: String, required: true },
    imageUrl: { type: String, default: 'https://placehold.co/600x400/a7a7a7/FFF?text=No+Image' },
    mfgTime: { type: Date, required: true },
    expiryTime: { type: Date, required: true },
    maxClaims: { type: Number, required: true, default: 1, min: 1 },
    claims: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String }
        }
    ],
}, { timestamps: true });

const FoodListing = mongoose.model('FoodListing', FoodListingSchema);


// --- *** Admin User Seeding Function *** ---
const seedAdminUser = async () => {
    try {
        const adminEmail = "admin@gmail.com";
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            console.log("Admin user not found. Creating...");
            const adminUser = new User({
                name: "Admin Sreekruthi",
                email: adminEmail,
                password: "adminbalu",
                role: "Admin"
            });
            await adminUser.save();
            console.log("Admin user created successfully.");
        } else {
            console.log("Admin user already exists.");
        }
    } catch (error) {
        console.error("Error seeding admin user:", error.message);
    }
};

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully.");
        seedAdminUser();
    })
    .catch(err => console.error("MongoDB connection error:", err));


// --- Authentication Middleware (protect) ---
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'No user found with this token' });
            }
            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- Admin Middleware ---
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

// --- Helper: Deletes an image file from the server ---
const deleteFile = (filePath) => {
    if (filePath && filePath.startsWith('/uploads/')) {
        const absolutePath = path.join(__dirname, filePath);
        fs.unlink(absolutePath, (err) => {
            if (err) console.error("Failed to delete file:", absolutePath, err);
            else console.log("Successfully deleted file:", absolutePath);
        });
    }
};

// --- Helper: Transform Image URL for Frontend ---
const transformImageUrl = (listing) => {
    const listingObject = listing.toObject();
    if (listingObject.imageUrl && listingObject.imageUrl.startsWith('/uploads/')) {
        listingObject.imageUrl = `http://localhost:${PORT}${listingObject.imageUrl}`;
    }
    return listingObject;
};


// --- Auth Routes (/api/auth/...) ---
const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    if (role === 'Admin' || email === 'admin@gmail.com') {
        return res.status(400).json({ message: 'Cannot register with this email or role.' });
    }
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = new User({ name, email, password, role });
        await user.save();
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }
    try {
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.json({
                token,
                user: { _id: user._id, name: user.name, email: user.email, role: user.role },
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login server error:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use(`${API_BASE_URL}/auth`, authRouter);

// --- Food Listing Routes (/api/food/...) ---
const foodRouter = express.Router();

// @route  POST /api/food (Create Listing)
foodRouter.post('/', protect, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'Donor') {
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        return res.status(403).json({ message: 'Only donors can create listings.' });
    }
    const { description, quantity, location, mfgTime, expiryTime, maxClaims, category } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!description || !quantity || !location || !mfgTime || !expiryTime || !maxClaims) {
        if (req.file) deleteFile(imageUrl);
        return res.status(400).json({ message: 'Please fill out all required fields.' });
    }

    try {
        const newListing = new FoodListing({
            donor: req.user._id,
            donorName: req.user.name,
            category: category || 'Other',
            description, quantity, location,
            imageUrl: imageUrl || undefined,
            mfgTime, expiryTime,
            maxClaims: parseInt(maxClaims, 10),
            claims: []
        });
        const savedListing = await newListing.save();

        res.status(201).json(transformImageUrl(savedListing));

    } catch (error) {
        console.error("Error creating listing:", error);
        if (req.file) deleteFile(imageUrl);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  PUT /api/food/:id (Update Listing)
foodRouter.put('/:id', protect, upload.single('image'), async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (listing.donor.toString() !== req.user._id.toString()) {
            if (req.file) deleteFile(`/uploads/${req.file.filename}`);
            return res.status(401).json({ message: 'User not authorized to update this listing' });
        }

        const { description, quantity, location, mfgTime, expiryTime, maxClaims, category } = req.body;
        let oldImageUrl = listing.imageUrl;

        if (req.file) {
            const newImageUrl = `/uploads/${req.file.filename}`;
            if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
                deleteFile(oldImageUrl);
            }
            listing.imageUrl = newImageUrl;
        }

        listing.category = category !== undefined ? category : listing.category;
        listing.description = description !== undefined ? description : listing.description;
        listing.quantity = quantity !== undefined ? quantity : listing.quantity;
        listing.location = location !== undefined ? location : listing.location;
        listing.mfgTime = mfgTime !== undefined ? mfgTime : listing.mfgTime;
        listing.expiryTime = expiryTime !== undefined ? expiryTime : listing.expiryTime;
        listing.maxClaims = (maxClaims !== undefined && !isNaN(parseInt(maxClaims, 10))) ? parseInt(maxClaims, 10) : listing.maxClaims;

        const updatedListing = await listing.save();

        res.json(transformImageUrl(updatedListing));

    } catch (error) {
        console.error("Error updating listing:", error);
        if (req.file) deleteFile(`/uploads/${req.file.filename}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  GET /api/food (Get Available Listings for Receivers)
foodRouter.get('/', protect, async (req, res) => {
    try {
        const listings = await FoodListing.find({
            expiryTime: { $gt: new Date() },
            $expr: { $lt: [{ $size: "$claims" }, "$maxClaims"] }
        }).sort({ expiryTime: 1 });

        res.json(listings.map(transformImageUrl));

    } catch (error) {
        console.error("Error getting all listings:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  GET /api/food/mylistings (Get Donor's own listings)
foodRouter.get('/mylistings', protect, async (req, res) => {
    if (req.user.role !== 'Donor') {
        return res.status(403).json({ message: 'Only donors can view their listings.' });
    }
    try {
        const listings = await FoodListing.find({ donor: req.user._id }).sort({ createdAt: -1 });

        res.json(listings.map(transformImageUrl));

    } catch (error) {
        console.error("Error getting donor listings:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  GET /api/food/myclaims (Receiver claims)
foodRouter.get('/myclaims', protect, async (req, res) => {
    if (req.user.role !== 'Receiver') {
        return res.status(403).json({ message: 'Only receivers can view their claims.' });
    }
    try {
        const listings = await FoodListing.find({
            "claims.userId": req.user._id
        }).sort({ createdAt: -1 });

        res.json(listings.map(transformImageUrl));

    } catch (error) {
        console.error("Error getting claims:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route  PUT /api/food/:id/claim (Claim a listing)
foodRouter.put('/:id/claim', protect, async (req, res) => {
    try {
        if (req.user.role !== 'Receiver') {
            return res.status(403).json({ message: 'Only receivers can claim food.' });
        }
        const listing = await FoodListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (new Date(listing.expiryTime) < new Date()) {
            return res.status(400).json({ message: 'This listing has expired.' });
        }

        if (listing.claims.length >= listing.maxClaims) {
            return res.status(400).json({ message: 'This listing is fully claimed.' });
        }

        const alreadyClaimed = listing.claims.some(claim => claim.userId.toString() === req.user._id.toString());
        if (alreadyClaimed) {
            return res.status(400).json({ message: 'You have already claimed this listing.' });
        }

        listing.claims.push({
            userId: req.user._id,
            name: req.user.name
        });

        const updatedListing = await listing.save();

        res.json({
            message: 'Listing claimed successfully!',
            listing: transformImageUrl(updatedListing)
        });
    } catch (error) {
        console.error("Error claiming listing:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route  DELETE /api/food/:id (Delete a listing)
foodRouter.delete('/:id', protect, async (req, res) => {
    try {
        const listing = await FoodListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        if (listing.donor.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            return res.status(401).json({ message: 'User not authorized to delete this listing' });
        }

        if (listing.imageUrl && listing.imageUrl.startsWith('/uploads/')) {
            deleteFile(listing.imageUrl);
        }

        await FoodListing.deleteOne({ _id: req.params.id });
        res.json({ message: 'Listing removed successfully' });
    } catch (error) {
        console.error("Error deleting listing:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use(`${API_BASE_URL}/food`, foodRouter);

// --- Admin Routes (/api/admin/...) ---
const adminRouter = express.Router();

const getDateFilter = (filterQuery) => {
    const dateFilter = {};
    const now = new Date();
    const fieldToFilter = 'createdAt';
    if (filterQuery === '1week') dateFilter[fieldToFilter] = { $gte: new Date(new Date().setDate(now.getDate() - 7)) };
    else if (filterQuery === '1month') dateFilter[fieldToFilter] = { $gte: new Date(new Date().setMonth(now.getMonth() - 1)) };
    else if (filterQuery === '3month') dateFilter[fieldToFilter] = { $gte: new Date(new Date().setMonth(now.getMonth() - 3)) };
    else if (filterQuery === '1year') dateFilter[fieldToFilter] = { $gte: new Date(new Date().setFullYear(now.getFullYear() - 1)) };
    return dateFilter;
};

adminRouter.get('/dashboard', protect, admin, async (req, res) => {
    try {
        const { filter } = req.query;
        const dateFilter = getDateFilter(filter);

        const userCount = await User.countDocuments();
        const listingCount = await FoodListing.countDocuments(dateFilter);

        const availableListings = await FoodListing.find({
            ...dateFilter,
            expiryTime: { $gt: new Date() },
            $expr: { $lt: [{ $size: "$claims" }, "$maxClaims"] }
        });
        const availableCount = availableListings.length;

        res.json({
            users: { total: userCount },
            listings: { total: listingCount, available: availableCount }
        });
    } catch (error) {
        console.error("Error getting admin dashboard stats:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

adminRouter.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error("Error getting admin users:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

adminRouter.get('/listings', protect, admin, async (req, res) => {
    try {
        const { filter } = req.query;
        const dateFilter = getDateFilter(filter);
        const listings = await FoodListing.find(dateFilter).sort({ createdAt: -1 });

        res.json(listings.map(transformImageUrl));

    } catch (error) {
        console.error("Error getting admin listings:", error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.use(`${API_BASE_URL}/admin`, adminRouter);

// --- Server Listen ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});