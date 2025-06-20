const mockAxios = {
    get : jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    // add put/delete/etc. if you ever call them in hooks
  };
  
  export default mockAxios;
  