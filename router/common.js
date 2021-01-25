function log(o) {
    console.log(o);
}
function randomname() {
  const data =
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F",
      "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y",
      "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r",
      "s", "t", "u", "v", "w", "x", "y", "z"];
  let nums = "";
  for (let i = 0; i < 13; i++) {
    const r = parseInt(Math.random() * 61, 10);
    nums += data[r];
  }
  return nums;
}
module.exports = {
  log: log,
  randomname: randomname
}  
