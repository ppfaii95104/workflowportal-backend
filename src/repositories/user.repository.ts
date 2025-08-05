// จำลองฐานข้อมูลในหน่วยความจำ (in-memory)
type User = {
  id: number;
  name: string;
};

let users: User[] = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
];

let nextId = 3;

export const findAllUsers = () => {
  return users;
};

export const addUser = (user: { name: string }) => {
  const newUser = { id: nextId++, ...user };
  users.push(newUser);
  return newUser;
};
