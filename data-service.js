const Sequelize = require('sequelize');
var sequelize = new Sequelize('d4uvnm09g7er51', 'baddigphpemkuj', 'b8884f7eb5f4ade5716926e4f8da0dd3197383be482722803629d4d20ec0a7aa', {
    host: 'ec2-75-101-133-29.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions:{
        ssl:true
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    } ,
    firstName: Sequelize.STRING,
    last_name: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department',{
    departmentId:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

module.exports.initialize = () => {
    return new Promise(function(resolve, reject){
        sequelize.sync().then(() => {
            resolve();
        }).catch(function(){
            reject("unable to sync the database");
        })
       
    });
};

module.exports.getAllEmployees = () => {
    return new Promise(function(resolve, reject){
        Employee.findAll().then((data) => {
            resolve(data);
        }).catch(()=>{
            reject("No results returned");    
        })        
    });
};

module.exports.getEmployeesByStatus = (status) => {
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where: {
                status: status
            }
        }).then((data) =>{
            resolve(data);
        }).catch(() =>{
            reject("No results returned");
        })
    });
};


module.exports.getEmployeesByDepartment = (department) => {
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where:{
                department: department
            }
        }).then((data) => {
            resolve(data);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};


module.exports.getEmployeesByManager = (manager) => {
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where:{
                employeeManagerNum: manager
            }
        }).then((data) =>{
            resolve(data[0]);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};


module.exports.getEmployeeByNum = (num) => {
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where:{
                employeeNum: num
            }
        }).then((data) =>{
            resolve(data[0]);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};

module.exports.getManagers = () => {
    return new Promise(function(resolve, reject){
        Employee.findAll({
            where:{
                isManager: 'true'
            }
        }).then((data)=>{
            resolve(data);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};


module.exports.getDepartments = () => {
    return new Promise(function(resolve, reject){
        Department.findAll().then((data)=>{
            resolve(data);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};


module.exports.addEmployee = (employeeData) => {
    return new Promise(function(resolve, reject){
        employeeData.isManager = (employeeData.isManager)? true : false;
        for(var i in employeeData){
            if(employeeData[i] == "")
                employeeData[i] = null;
        }
        Employee.create(employeeData)
        .then(()=>{
            resolve("Employee added successfully!");
        }).catch(()=>{
            reject("Unable to create employee!");
        })       
    });
};


module.exports.updateEmployee = (employeeData) => {
    return new Promise(function(resolve, reject){
        employeeData.isManager = (employeeData.isManager)? true : false;
        for(var i in employeeData){
            if(employeeData[i] == "")
                employeeData[i] = null;
        }
        Employee.update(employeeData, {
            where: {
                employeeNum: employeeData.employeeNum
            }
        }).then(()=>{
            resolve("Employee updated successfully!");
        }).catch(()=>{
            reject("Unable to update employee!")
        })
    });
};

module.exports.addDepartment = (departmentData) => {
    return new Promise(function(resolve,reject){
        for(var i in departmentData){
            if(departmentData[i] == "")
                departmentData[i] = null;
        }
        Department.create(departmentData)
        .then(()=>{
            resolve("Department added successfully!");
        }).catch(()=>{
            reject("Unable to create department!");
        })
    });
};

module.exports.updateDepartment = (departmentData) =>{
    return new Promise(function(resolve, reject){
        for(var i in departmentData){
            if(departmentData[i] == "")
                departmentData[i] = null;
        }
        Department.update(departmentData, {
            where:{
                departmentId: departmentData.departmentId
            }
        }).then(()=>{
            resolve("Department updated successfully");
        }).catch(() =>{
            reject("Unable to update department");
        })
    });
};

module.exports.getDepartmentById = (id) =>{
    return new Promise(function(resolve, reject){
        Department.findAll({
            where:{
                departmentId: id
            }
        }).then((data) =>{
            resolve(data[0]);
        }).catch(()=>{
            reject("No results returned");
        })
    });
};

module.exports.deleteEmployeeByNum = (empNum) =>{
    return new Promise(function(resolve, reject){
        Employee.destroy({
            where:{
                employeeNum: empNum
            }
        }).then(()=>{
            resolve("Employee Deleted");
        }).catch(()=>{
            reject("Cannot delete Employee");
        })
    });
};

module.exports.deleteDepartmentById = (id) =>{
    return new Promise(function(resolve, reject){
        Department.destroy({
            where:{
                departmentId: id
            }
        }).then(()=>{
            resolve("Department Deleted");
        }).catch(()=>{
            reject("Cannot delete Department");
        })
    });
};
