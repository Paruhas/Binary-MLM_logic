// const User = [
//   { id: 1, username: "user1" },
//   { id: 2, username: "user2" },
//   { id: 3, username: "user3" },
//   { id: 4, username: "user4" },
//   { id: 5, username: "user5" },
//   { id: 6, username: "user6" },
//   { id: 7, username: "user7" },
//   { id: 8, username: "user8" },
//   { id: 9, username: "user9" },
//   { id: 10, username: "user10" },
//   { id: 11, username: "user11" },
//   { id: 12, username: "user12" },
// ];

// const UserPlace = [
//   { id: 1, userIdWhoCanEdit: "1", userIdWhoGotEdit: "2" },
//   { id: 2, userIdWhoCanEdit: "1", userIdWhoGotEdit: "3" },
//   { id: 3, userIdWhoCanEdit: "1", userIdWhoGotEdit: "4" },
//   { id: 4, userIdWhoCanEdit: "2", userIdWhoGotEdit: "5" },
//   { id: 5, userIdWhoCanEdit: "3", userIdWhoGotEdit: "6" },
//   { id: 6, userIdWhoCanEdit: "3", userIdWhoGotEdit: "7" },
//   { id: 7, userIdWhoCanEdit: "4", userIdWhoGotEdit: "8" },
//   { id: 8, userIdWhoCanEdit: "1", userIdWhoGotEdit: "9" },
//   { id: 9, userIdWhoCanEdit: "1", userIdWhoGotEdit: "10" },
//   { id: 10, userIdWhoCanEdit: "7", userIdWhoGotEdit: "11" },
//   { id: 11, userIdWhoCanEdit: "11", userIdWhoGotEdit: "12" },
// ];

// const findUser = User.filter((item) => {
//   return item.id === 1;
// });
// console.log(findUser, "findUser");

// const findUserPlace = UserPlace.filter((item) => {
//   return findUser[0].id == item.userIdWhoCanEdit;
// }, {});
// console.log(findUserPlace, "findUserPlace");

// // ----- -----

// const headId = "3";
// const placeId = "6";

// const output1 = [6, 7, 11, 12, 13, 14, 21];

// const reduceOutput1 = output1.reduce(
//   (acc, item) => {
//     if (item === +placeId) {
//       acc["headLineId"].push(+headId);
//     }
//     if (item !== +placeId) {
//       acc["memberLineId"].push(item);
//     }
//     return acc;
//   },
//   { headLineId: [], memberLineId: [] }
// );

// console.log(reduceOutput1, "reduceOutput1");

// const validateTests = ["L", "R"];
// let validateCount = 0;

// validateTests.map((item) => {
//   if (item !== "A") {
//     validateCount += 1;
//   }
//   if (item !== "A") {
//     validateCount += 1;
//   }
// });

// console.log(validateCount, "validateCount");

// // ----- -----

// const getChildren = (id) =>
//     (relations[id] || []).flatMap((o) => [o, ...getChildren(o.id)]),
//   data = [
//     { id: 1, parentId: 0 },
//     { id: 2, parentId: 1 },
//     { id: 3, parentId: 1 },
//     { id: 4, parentId: 2 },
//     { id: 5, parentId: 4 },
//     { id: 6, parentId: 3 },
//     { id: 7, parentId: 6 },
//     { id: 8, parentId: 7 },
//   ],
//   relations = data.reduce((r, o) => {
//     // console.log(o);
//     (r[o.parentId] = []).push(o);
//     return r;
//   }, {});

// // console.log(getChildren(2)); // 4 5
// // console.log(getChildren(3)); // 6 7 8

// function fun1(a) {
//   function fun2(b) {
//     return a + b;
//   }
//   return fun2;
// }

// console.log(fun1(1)(2));

// const dayjs = require("dayjs");
// const utc = require("dayjs/plugin/utc");
// const timezone = require("dayjs/plugin/timezone");
// dayjs.extend(utc);
// dayjs.extend(timezone);

// const firstDate = 1634272445821; // 15-10-64 11:34

// var expiryDate = new Date(1634272445821);
// console.log(expiryDate);
// expiryDate.setMonth(expiryDate.getMonth() + 11);
// console.log(expiryDate);

// const testDate = new Date("2021-10-14T09:57:45.000Z");
// console.log(testDate);
// const duration = 6;
// const newTestDate = new Date(testDate.setMonth(testDate.getMonth() + duration));
// console.log(newTestDate);

const testArr = {
  test: [
    {
      position: "L",
      parentId: 1,
      userId: 2,
      userData: {
        id: 2,
        username: "User_02",
        CommissionCalculator: {
          packageBuyForCalculator: "120.0000",
        },
        PackageDuration: {
          expireDate: "2021-11-25T06:00:19.000Z",
          packageStatus: "ACTIVE",
        },
      },
    },
    {
      position: "R",
      parentId: 1,
      userId: 3,
      userData: {
        id: 3,
        username: "User_03",
        CommissionCalculator: {
          packageBuyForCalculator: "90.0000",
        },
        PackageDuration: {
          expireDate: "2021-11-25T06:00:20.000Z",
          packageStatus: "ACTIVE",
        },
      },
    },
  ],
};

console.log(testArr);

const testObj = {};

if (
  +testArr.test[0].userData.CommissionCalculator.packageBuyForCalculator >
  +testArr.test[1].userData.CommissionCalculator.packageBuyForCalculator
) {
  console.log("0 > 1");

  testObj.strongLeg_userId = testArr.test[0].userData;
  testObj.weakLeg_userId = testArr.test[1].userData;
}

if (
  +testArr.test[0].userData.CommissionCalculator.packageBuyForCalculator <
  +testArr.test[1].userData.CommissionCalculator.packageBuyForCalculator
) {
  console.log("0 < 1");

  testObj.strongLeg_userId = testArr.test[1].userData;
  testObj.weakLeg_userId = testArr.test[0].userData;
}

console.log(testObj);

testArr.strongLeg_userId = { ...testObj.strongLeg_userId };
testArr.weakLeg_userId = { ...testObj.weakLeg_userId };

delete testArr.test;

console.log(testArr);
