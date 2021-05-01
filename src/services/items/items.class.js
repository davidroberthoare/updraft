const { Service } = require('feathers-mongodb');

exports.Items = class Items extends Service {
  constructor(options, app) {
    super(options);
    
    app.get('mongoClient').then(db => {
      this.Model = db.collection('items');
    });
  }


  create (data, params) {
    data.userid = params.user._id;
    if(data.type=='i-text' || data.type=='textbox'){  //add a special parameter for text items
      data.isLive = true;
    }
    
    console.log("creating Item", data)
    
    // Call the original `create` method with existing `params` and new data
    return super.create(data, params);
  }  


  update (id, data, params) {
    console.log("updating Item", data)
    // Call the original `patch` method with existing `params` and new data
    return super.update(id, data, params);
  }  


  patch (id, data, params) {
    console.log("patching Item", data)
    // Call the original `patch` method with existing `params` and new data
    return super.patch(id, data, params);
  }  


  remove (data, params) {
    console.log("removing item", data);
    if(data.all===true){
      console.log("removing ALL items");
      const params = {};
      return super.remove(null, params);
    }
    else if(data.id){
      console.log("removing ONE item", data.id);
      const params = {};
      return super.remove(data.id, params);
    }
  }  


};
