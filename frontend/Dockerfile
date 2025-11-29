FROM node:24-alpine


COPY ./ /frontend
WORKDIR "/frontend"
RUN npm install
CMD ["npm", "run", "dev", "--", "--host"]