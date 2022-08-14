const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//connect to mongoose database
mongoose.connect('mongodb+srv://admin-masa:Masa4190@cluster0.xido2.mongodb.net/todolistDB');

//create schema and model
const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do List!"
});
const item2 = new Item({
  name: "Hit the + button to add a new task!"
});
const item3 = new Item({
  name: "<--This this to delete the task"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res){
  const day = date.getDate();
  Item.find({}, function(err, items){
      if (items.length === 0){
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err);
          } else {
            console.log("Added Successfully");
          }
        });
        res.redirect("/");
      } else {
        res.render('list', {listTitle: day, newListItem: items});
      }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const day = date.getDate();
  const newItem = new Item({
    name: itemName
  });
  console.log("Add: "+listName);
  if (listName === day) {
    newItem.save(function(err){
      if (!err){
        res.redirect("/");
      }
    });
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save(function(err){
        if (!err){
          res.redirect("/"+listName);
        }
      });
    });
  }
});

app.post("/delete", function(req, res){
  const checked_id = req.body.checkbox;
  const listName = req.body.listName;
  const day = date.getDate();
  console.log("delete: " + listName);
  if (listName === day) {
    Item.findByIdAndRemove(checked_id, function(err){
      if (err){
        console.log(err);
      } else{
        console.log("Item deleted Successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName }, {$pull: {items: {_id: checked_id}}}, function(err, foundList){
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
          res.render('list', {listTitle: foundList.name, newListItem: foundList.items});
        }
    }
  });
});



app.get("/about", function(req, res){
  res.render('about');
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server is running on port " + port);
});
