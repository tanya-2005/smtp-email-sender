const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const { JSON_BODY_LIMIT } = require('./config/limits');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
