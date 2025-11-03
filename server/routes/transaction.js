const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const Transaction = require('../models/Transaction'); 

// POST /api/transactions

router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;

    const newTransaction = new Transaction({
      description,
      amount,
      category,
      type,
      date,
      userId: req.user.id // Get the user ID from the auth middleware
    });

    const transaction = await newTransaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   GET /api/transactions

router.get('/', auth, async (req, res) => {
  try {
    // Find all transactions, sorted by date (newest first)
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   PUT /api/transactions/:id

router.put('/:id', auth, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Ensure the user owns this transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update the transaction
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // $set updates only the fields provided in the body
      { new: true } // {new: true} returns the document after the update
    );

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   DELETE /api/transactions/:id

router.delete('/:id', auth, async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }

    // Ensure the user owns this transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Transaction removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;