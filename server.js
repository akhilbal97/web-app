/********************************************************************************* 
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part  
*  of this assignment has been copied manually or electronically from any other source  
*  (including 3rd party web sites) or distributed to other students. 
*  Name: Akhil Balachandran     Student ID: 153089172   Date: 2019-04-10
*  Online (Heroku) Link: https://desolate-tor-40101.herokuapp.com/
*  
********************************************************************************/  
var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var path = require("path");
var service = require("./data-service.js");
var multer = require("multer");
var fs = require("fs");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var dataServiceAuth = require("./data-service-auth.js")
var clientSessions = require("client-sessions");


function onHttpStart() {
    console.log("Express http server listening on " + HTTP_PORT);
}

app.engine(".hbs", exphbs({
    extname: ".hbs",
    defaultLayout: 'main',
    helpers:{
        navLink: function (url, options) {
        return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
        equal: function(lvalue, rvalue, options){
        if(arguments.length<3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
        if(lvalue != rvalue){
            return options.inverse(this);
        }else{
            return options.fn(this);
        }
    }
    }
        }));
app.set('view engine', '.hbs');

app.use(function(req, res, next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route =="/")?"/":route.replace(/\/$/,"");
    next();
});

const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

var upload = multer({storage: storage});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(clientSessions({
    cookieName: "session",
    secret: "webapp322_assign6",
    duration: 2 * 60 * 1000,
    activeDurationL: 1000 * 60
}));

app.use(function(req, res, next){
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next){
    if(!req.session.user){
        res.redirect("/login");
    }
    else{
        next();
    }
}

app.get("/login", (req, res) =>{
    res.render('login');
});

app.get("/register", (req, res) =>{
    res.render('register');
});

app.post("/register", (req, res) =>{
    dataServiceAuth.registerUser(req.body)
    .then(()=>{
        res.render('register', {successMessage: "User Created"})
       })
    .catch((err) =>{
        res.render('register', {errorMessage: err, userName: req.body.userName})
    });
})

app.post("/login", (req, res) =>{
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then((user) =>{
        req.session.user ={
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory
        }
        res.redirect('/employees');
    })
    .catch((err) =>{
        res.render("login", {errorMessage: err, userName: req.body.userName});
    });
});

app.get("/logout", (req, res) =>{
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) =>{
    res.render('userHistory');
})

app.get("/", (req, res) => {
    res.render('home');
});

app.get("/home", (req, res) => {
    res.render('home');
});

app.get("/about", (req, res) => {
    res.render('about');
});

app.get("/employees", ensureLogin, (req, res) => {
    if(req.query.status){
        service.getEmployeesByStatus(req.query.status).then((value) => {
            res.render("employees", {employees: value});
        }).catch((err) => {
            res.render({message: "no results"}); 
        })
    }
    else if(req.query.department){
        service.getEmployeesByDepartment(req.query.department).then((value) => {
            res.render("employees", {employees: value});
        }).catch((err) => {
            res.render({message: "no results"}); 
        })
    }
    else if(req.query.manager){
        service.getEmployeesByManager(req.query.manager).then((value) => {
            res.render("employees", {employees: value});
        }).catch((err) => {
            res.render({message: "no results"}); 
        })
    }
    else {    
        service.getAllEmployees().then((value) => {
            res.render("employees", {employees: value});
        }).catch((err) => {
            res.render({message: "no results"}); 
        })
    }
});

app.get("/employee/:empNum", ensureLogin, (req, res) => {
    //initialize an empty object to store the values
    let viewData = {};

    service.getEmployeeByNum(req.params.empNum)
    .then((data) =>{
        viewData.data = data; //store employee data in the viewData
    }).catch(()=>{
        viewData.data = null; //set employee to null if there was an error
    }).then(service.getDepartments)
    .then((data)=>{
        viewData.departments = data; 

        //loop through the viewData.departments and once we have found the 
        //departmentId that matches the employee's department value, add a
        //selected property to the matching viewData.departments object

        for(let i=0;i<viewData.departments.length;i++){
            if(viewData.departments[i].departmentId == viewData.data.department){
                viewData.departments[i].selected = true;
            }
        }
    }).catch(()=>{
        viewData.departments=[];
    }).then(()=>{
        if(viewData.data == null){
            res.status(404).send("Employee Not Found");
        }else{
            res.render("employee", { viewData : viewData });
        }
    });
});

app.post("/employee/update", ensureLogin, (req,res) => {
    service.updateEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) =>{
        console.log(err);
    });
    
});


app.get("/employees/add", ensureLogin, (req, res) => {
    service.getDepartments().then((data)=>{
        res.render('addEmployee', {departments:data});
    }).catch(()=>{
        res.render('addEmployee', {departments:[]});
    });
    
});

app.post("/employees/add", ensureLogin, (req, res) => {
    service.addEmployee(req.body).then((data) => {
        res.redirect("/employees");
    }).catch((err) =>{
        console.log(err);
    });
});

app.get("/employee/delete/:empNum", ensureLogin, (req, res) =>{
    service.deleteEmployeeByNum(req.params.empNum).then(()=>{
        res.redirect("/employees");
    }).catch(()=>{
        res.status(500).send("Unable to Remove Employee / Employee not found");
    });
});

app.get("/departments", ensureLogin, (req, res) => {
    service.getDepartments().then((data) => {
        res.render("departments", {departments: data});
    })
    .catch((err) => {
        res.json({message: err});
    });
}); 

app.get("/departments/add", ensureLogin, (req, res) =>{
    res.render("addDepartment");
});

app.post("/departments/add", ensureLogin, (req, res) => {
    service.addDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        console.log(err);
    });
});

app.post("/department/update", ensureLogin, (req,res) => {
    service.updateDepartment(req.body).then(()=>{
        res.redirect("/departments");
    }).catch((err)=>{
        console.log(err);
    });
});

app.get("/department/:departmentId", ensureLogin, (req, res) => {
    service.getDepartmentById(req.params.departmentId).then((data) => {
        res.render("department", {department: data }); 
    }).catch(() => {
        res.status(404).send("Department Not Found");
    });
});

app.get("/department/delete/:id", ensureLogin, (req, res) =>{
    service.deleteDepartmentById(req.params.id).then(()=>{
        res.redirect("/departments");
    }).catch(()=>{
        res.status(500).send("Unable to Remove Department / Department not found");
    });
});
app.get("/images/add", ensureLogin, (req, res) =>  {
    res.render('addImage');
});

app.post("/images/add", upload.single("imageFile"), ensureLogin, function(req, res){
    res.redirect("/images");
});

app.get("/images", ensureLogin, (req,res) =>{
    fs.readdir("./public/images/uploaded", function(err, data) {
       res.render("images", {data});
    });
});

app.use((req,res) => {
    res.status(404).send("Page Not Found, 404");
});

service.initialize()
.then(dataServiceAuth.initialize)
.then(() => { 
    app.listen(HTTP_PORT, onHttpStart);
}).catch(function(err){
    console.log("Unable to start server: " + err);
});