const users = require('./users/users.service.js');
const messages = require('./messages/messages.service.js');
const items = require('./items/items.service.js');
const uploads = require('./uploads/uploads.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(messages);
  app.configure(items);
  app.configure(uploads);
};
