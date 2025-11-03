const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const router = express.Router();

//POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    // 1. Get user data from the request body
    const { name, email, password } = req.body;

    // 2. Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    // 3. Create a new user instance
    user = new User({
      name,
      email,
      password,
    });

    // 4. Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 5. Save the user to the database
    await user.save();
    
    // We can create and send a token right away upon registration
    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// Endpoint: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        // 1. Get user credentials from the request body
        const { email, password } = req.body;

        // 2. Find the user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        
        // 3. Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // 4. If credentials are correct, create and return a JWT
        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;