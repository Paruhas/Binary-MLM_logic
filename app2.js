const User = [
  { id: 1, username: "user1" },
  { id: 2, username: "user2" },
  { id: 3, username: "user3" },
  { id: 4, username: "user4" },
  { id: 5, username: "user5" },
  { id: 6, username: "user6" },
  { id: 7, username: "user7" },
  { id: 8, username: "user8" },
  { id: 9, username: "user9" },
  { id: 10, username: "user10" },
  { id: 11, username: "user11" },
  { id: 12, username: "user12" },
];

const UserPlace = [
  { id: 1, userIdWhoCanEdit: "1", userIdWhoGotEdit: "2" },
  { id: 2, userIdWhoCanEdit: "1", userIdWhoGotEdit: "3" },
  { id: 3, userIdWhoCanEdit: "1", userIdWhoGotEdit: "4" },
  { id: 4, userIdWhoCanEdit: "2", userIdWhoGotEdit: "5" },
  { id: 5, userIdWhoCanEdit: "3", userIdWhoGotEdit: "6" },
  { id: 6, userIdWhoCanEdit: "3", userIdWhoGotEdit: "7" },
  { id: 7, userIdWhoCanEdit: "4", userIdWhoGotEdit: "8" },
  { id: 8, userIdWhoCanEdit: "1", userIdWhoGotEdit: "9" },
  { id: 9, userIdWhoCanEdit: "1", userIdWhoGotEdit: "10" },
  { id: 10, userIdWhoCanEdit: "7", userIdWhoGotEdit: "11" },
  { id: 11, userIdWhoCanEdit: "11", userIdWhoGotEdit: "12" },
];

const findUser = User.filter((item) => {
  return item.id === 1;
});
console.log(findUser);

const findUserPlace = UserPlace.filter((item) => {
  return findUser.id == item.userIdWhoCanEdit;
}, {});
console.log(findUserPlace);

// ----- -----

const headId = "3";
const placeId = "6";

const output1 = [6, 7, 11, 12, 13, 14, 21];

const reduceOutput1 = output1.reduce(
  (acc, item) => {
    if (item === +placeId) {
      acc["headLineId"].push(+headId);
    }
    if (item !== +placeId) {
      acc["memberLineId"].push(item);
    }
    return acc;
  },
  { headLineId: [], memberLineId: [] }
);

console.log(reduceOutput1, "reduceOutput1");

const validateTests = ["L", "R"];
let validateCount = 0;

validateTests.map((item) => {
  if (item !== "A") {
    validateCount += 1;
  }
  if (item !== "A") {
    validateCount += 1;
  }
});

console.log(validateCount);
