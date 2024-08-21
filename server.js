const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

mongoose.connect('mongodb+srv://sabareesh:sabari123@cluster0.0zhev.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.json());

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  gender: String,
  lastLoginDate: Date,
  isAdmin: Boolean,
}));

app.post('/signup', async (req, res) => {
  const user = new User({ ...req.body, lastLoginDate: new Date(), isAdmin: false });
  await user.save();
  res.sendStatus(200);
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || user.password !== req.body.password) {
    return res.sendStatus(401);
  }
  user.lastLoginDate = new Date();
  await user.save();
  res.json({ isAdmin: user.isAdmin });
});

app.get('/profile', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.query.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
    console.log("User fetched:", user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/admin-dashboard', async (req, res) => {
  try {
    // Fetch user data from MongoDB
    const users = await User.find({});

    // Aggregate user count by month
    const aggregateData = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // Assumes users have a 'createdAt' field
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by month
      }
    ]);

    const chartLabels = aggregateData.map(item => {
      const date = new Date(2020, item._id - 1, 1); // Creating date for label
      return date.toLocaleString('default', { month: 'short' });
    });

    const chartData = aggregateData.map(item => item.count);

    res.json({ users, chartLabels, chartData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard data', error });
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
