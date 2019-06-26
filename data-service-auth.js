var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
var userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    }, 
    "password": String,
    "email": String, 
    "loginHistory": [{
        dateTime: Date,
        userAgent: String
    }]
})

let User; // to be defined on new connection (see initialize) 

 
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://dbUser:1234@senecaweb-lqkxh.mongodb.net/web322_week8?retryWrites=true");
        db.on('error', (err)=>{             
            reject(err); // reject the promise with the provided error 
        });         
        db.once('open', ()=>{            
            User = db.model("users", userSchema);            
            resolve();         
        });     
    }); 
}; 

module.exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if(userData.password !== userData.password2){
            reject("Passwords do not match");
        }
        else{
            let newUser = new User(userData);
            bcrypt.genSalt(10, function(err, salt) {
                if(err){
                    reject("There was an error encrypting the password");
                }
                // Generate a "salt" using 10 rounds     
                bcrypt.hash(userData.password, salt, function(err, hash) { 
                    if(err){
                        reject("There was an error encrypting the password");
                    }
                    else{
                        userData.password = hash;
                        newUser.save()
                        .then(() =>{
                            resolve();
                        })
                        .catch((err)=>{
                            if(err.code == 11000){
                                reject("User Name already taken");
                            }
                            else {
                                reject("There was an error creating the user:"+err);
                            }
                        });
                        
                    }
                }); 
            }); 
           
         }
    });
}

module.exports.checkUser = function (userData){

    return new Promise(function (resolve, reject){
        User.find({userName: userData.userName})
        .exec()
        .then((users)=>{
            bcrypt.compare(userData.password, users[0].password )
            .then((res) => {
                users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                User.update({ userName: users[0].userName},
                            { $set: { loginHistory: users[0].loginHistory } },
                            { multi: false })
                .exec()
                .then( ()=>{
                    resolve(users[0]);
                })
                .catch((err)=>{
                    reject("There was an error verifying the user: " + err);
                });
            })
            .catch((err)=>{
                reject("Incorrect Password for user: " + userData.userName);
            })  
        })
        .catch((err)=>{
            reject("Unable to find user: " + userData.userName);
        });
    });
}