# Node.js 베이스 이미지 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 애플리케이션 소스 복사
COPY . .

# 빌드 실행
RUN npm run build

# 포트 설정
EXPOSE 3000

# 애플리케이션 시작 명령어
CMD ["npm", "start"]