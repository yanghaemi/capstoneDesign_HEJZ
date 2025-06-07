import React, { createContext, useState, useContext } from 'react';

type UserInfo = {
  name: string;
  bio: string;
  username: string;
  profileImage: any;
};

const defaultUser: UserInfo = {
  name: '사용자 님',
  bio: '',
  username: 'jihye_',
  profileImage:'',
};

const UserContext = createContext<{
  user: UserInfo;
  setUser: React.Dispatch<React.SetStateAction<UserInfo>>;
}>({
  user: defaultUser,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserInfo>(defaultUser);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);