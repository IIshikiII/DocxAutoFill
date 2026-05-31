FROM node:24-alpine

WORKDIR /frontend

# Dependency layer — cached unless package manifests change.
COPY package*.json ./
RUN npm install

# Application source — editing it does not invalidate the dependency layer.
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
