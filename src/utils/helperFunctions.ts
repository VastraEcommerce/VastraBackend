export const isUniqueArray = <T>(arr: Array<T>, property: keyof T) => {
  const unique = [...new Set(arr.map((item) => item[property]))];
  console.log({ unique });
  console.log({ arr });
  console.log(unique.length === arr.length);
  return unique.length === arr.length;
};
