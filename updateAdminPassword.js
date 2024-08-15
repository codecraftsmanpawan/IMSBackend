const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  addAdminUser(); // Call function to add admin user
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Function to add admin user
async function addAdminUser() {
  const username = 'admin'; 
  const password = 'secureAdminPassword123'; 

  try {
    // Check if the admin user already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }

    // Create a new admin user
    const newAdmin = new Admin({
      username,
      password, // No need to hash the password here
    });

    // Save the new admin user to the database
    await newAdmin.save();
    console.log('Admin user added successfully');
    
    // Close the database connection
    mongoose.connection.close();
  } catch (err) {
    console.error('Error adding admin user:', err);
    mongoose.connection.close();
  }
}
