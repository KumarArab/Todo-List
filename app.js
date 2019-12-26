const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

//database connetion string
mongoose.connect("your mongodb url", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//template setup
app.set('view engine', 'ejs');

//html document retriver
app.use(bodyParser.urlencoded({
  extended: true
}));

//express calling files other than html(css and images).
app.use(express.static("public"));

//database schema
const itemSchema = {
  name: {
    type: String,
    required: true
  }
};

const listSchema = {
  name: String,
  item: [itemSchema]
};
//instance of a schema
const Item = mongoose.model("Item", itemSchema);

const List = mongoose.model("List", listSchema);

//default Items:
const code = new Item({ //1
  name: "Welcome to your todo List"
});
const play = new Item({ //2
  name: "Click + button to add items"
});
const coffee = new Item({ //3
  name: "Click the checkBoxes to delete items"
});

const defaultItem = [code, play, coffee];



app.get("/", function(req, res) {

  //retriving data from databsse
  Item.find(function(err, Items) {
    if (err) {
      console.log(err);
    } else {
      if (Items.length === 0) {
        //inseting into database
        Item.insertMany(defaultItem, function(err) {
          if (err) {
            console.log("Error Occured! try again");
          } else {
            console.log("Default Items inserted successfully.");
          }
        });
        res.redirect("/");
      }
      else{
        res.render('list', {
            listtitle: "Today",
            listitem: Items
         });
      }
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.val;
  const listName = req.body.Hitme;

  const todoitem = new Item({
    name: itemName
  });
  if(listName === "Today"){
    todoitem.save();
    res.redirect("/");
  }
  else{
      List.findOne({name: listName}, function(err, result){
        result.item.push(todoitem);
        result.save();
        res.redirect("/"+listName);
      });

  }

});

app.post("/delete",function(req,res){
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.deleteOne({_id: checkedItem}, function(err){
      //also we can use: Item.findByIdAndremove(checkedItem,function(err){});
      if(err){
        console.log(err);
      }
      else{
        console.log("Item deleted successfully");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull: {item: {_id: checkedItem}}}, function(err, results){
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }

});

app.get("/:route",function(req,res){
  const urlinfo = lodash.capitalize(req.params.route);

  List.findOne({name:urlinfo},function(err,result){
    if(err){
      console.log(err);
    }
    else{
      if(!result){
        const list = new List({
          name: urlinfo,
          item: defaultItem
        });
          list.save();
          res.redirect("/"+urlinfo);
        }
      else{
        res.render('list', {
            listtitle: result.name,
            listitem: result.item
         });
      }
    }
  });

})

app.get("/about", function(req, res) {
  res.render('about');
});

// app.post("/work", function(req, res) {
//   let item = req.body.val;
//   worklist.push(item);
//   res.redirect("/work");
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
