require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const YAML = require('yamljs');
const cors = require('cors');

const app = express();
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"], // files where you write docs
}

// const swaggerSpec = swaggerJsdoc(options);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const swaggerDocument = require("./docs/api-docs.js");

// Setup Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use(express.json());
app.use(cors({
  origin: '*', // allows requests from any domain
  methods: ['GET','POST','PUT','DELETE','OPTIONS'], // allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // allowed headers
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const requestRoutes = require('./routes/requests');
const reviewRoutes = require('./routes/reviews');
const workerDashboard = require('./routes/workerDashboard');
const workerSkillsRoutes = require('./routes/workerSkills');
const user=require("./routes/user");
app.use('/worker/skills', workerSkillsRoutes);
app.use('/worker', workerDashboard);
app.use('/reviews', reviewRoutes);
app.use('/requests', requestRoutes);
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);
app.use('/user',user)
app.get("/health",(req,res)=>{
    res.json({
      "health":"Bdiya hai hai "
    })
})
app.listen(process.env.PORT|| 3000, "0.0.0.0",() => console.log(`Server running on port ${process.env.PORT}`));
