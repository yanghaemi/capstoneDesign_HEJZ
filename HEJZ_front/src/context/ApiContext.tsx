import React, { createContext, useContext } from 'react';

/*api url을 하위 컴포넌트에서 자유롭게 쓰게 하기 위해 context로 전달하는 tsx 파일*/


// 타입 정의
interface ApiContextType {
  apiUrl: string;
  apiKey: string;
}

// 기본값 (초기값은 임시용 빈 값, 실제 값은 Provider에서 설정됨)
export const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiContext.Provider');
  }
  return context;
};