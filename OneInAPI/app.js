// Importing required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Creating an Express application instance
const app = express();
const PORT = process.env.PORT;

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});



// USER

// Define a schema for the User collection
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);



// Middleware to parse JSON bodies
app.use(express.json());

// Middleware for JWT validation
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = decoded;
    next();
  });
};

// Route to register a new user
app.post('/api/register', async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to authenticate and log in a user
app.post('/api/login', async (req, res) => {
  try {
    // Check if the email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) { 
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ email: user.email }, 'secret');
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route to get user details
app.get('/api/user', verifyToken, async (req, res) => {
  try {
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


//POST 

// Define a schema for the Post collection
const PostSchema = new mongoose.Schema({
  desc: String,
  title: String,
},
  {timestamps: true}
);

// Create a Post model based on the schema
const Post = mongoose.model('Post', PostSchema);


//Add new post
app.post('/api/post', verifyToken, async (req, res) => {
  try{
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const existingPost = await Post.findOne({title: req.body.title});
    if(existingPost){
      return res.status(404).json({error: 'Post already added'});
    }else{
      // Create a new post
    const newPost = new Post({
      desc: req.body.desc,
      title: req.body.title,
    });
    
    await newPost.save();
    res.status(201).json({ message: 'Post added successfully' });
    }
  } catch (error){
    res.status(500).json({error: 'Internal server error'})
  }
})

//Get all posts
app.get('/api/post/', verifyToken, async (req, res) => {
  try{

    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await Post.find();

    res.status(200).json(posts);
  }catch(error){
    res.status(500).json(error);
  }
})

//Update a post
app.put('/api/post/:id', verifyToken, async (req, res) => {
  try{
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const post = Post.findById(req.params.id);
    if(!post){
      res.status(404).json({error: "Post not found"})
    }else{
      const updatedPost = req.body;
      await Post.findByIdAndUpdate(req.params.id, updatedPost, {new: true})
        .then(post => {
          res.status(200).json({post: post})
      })
    }

  }catch(error){
    res.status(500).json(error);
  }
})

//Delete a post
app.delete('/api/post/:id', verifyToken, async (req, res) => {
  try{
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const post = Post.findById(req.params.id);
    if(!post){
      res.status(404).json({error: "Post not found"})
    }else{
      await Post.findByIdAndDelete(req.params.id)
        .then(post => {
          res.status(200).json({"success": "Post deleted successfully"})
      })
    }

  }catch(error){
    res.status(500).json(error);
  }
})


//E-commerce


//Item model
const ItemSchema = new mongoose.Schema({

  owner: {
    type: ObjectID,
    required: true,
    ref: 'User'
  },

  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

}, 
  {timestamps: true,}
)

const Item = mongoose.model('Item', ItemSchema);

//Add a new item
app.post('/api/items', verifyToken, async (req, res) => {
  try{
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }else{
      const newItem = new Item({
        ...req.body,
        owner: req.user._id
      })
    }
  }catch(error){
    res.status(500).json(error);
  }
})


//Cart model
const ObjectID = mongoose.Schema.Types.ObjectId;

const CartSchema = new mongoose.Schema({
  owner: {
    type: ObjectID,
    required: true,
    ref: 'User'
  },
  items: [{
    itemId: {
     type: ObjectID,
     ref: 'Item',
     required: true
  },
  name: String,
  quantity: {
     type: Number,
     required: true,
     min: 1,
     default: 1},
     price: Number
   }],
   bill: {
    type: Number,
    required: true,
   default: 0
  }
}, 
  {timestamps: true}
)

const Cart = mongoose.model('Cart', CartSchema)


// Default route
app.get('/', (req, res) => {
  res.send('Welcome to my collection of APIs !');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});