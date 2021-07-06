# Builder: copy packages from my directory to builder, copy everything from my directory to builder 
# install all dependencies, 

FROM node:14 as builder
WORKDIR /app
RUN ls && pwd
# COPY package.json package.json
COPY . .
# node_modules folder in /app/node_modules
RUN npm install . 
#RUN npm install typescript -g
# RUN tsc singleday_query.ts # Run tsc src/ -> outputs a ./dist folder

######

FROM node:14-alpine
ENTRYPOINT [ "node" ]
WORKDIR /app
# Copy from the builder the node_modules, and the dist
#COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app . 
#COPY --from=builder /app/singleday_query.ts .
# TODO: copy the transpiled ts -> js files from the dist 
CMD ["/app/node_modules/.bin/ts-node", "./src/index.ts"]

# use docker logs {container hash}