# nodejs 4.3.1 as base
FROM node:4.3.1

# get additional os packages (mainly npm)
ONBUILD RUN apt-get update && apt-get install -y build-essential

# copy dependency file for npm into the container --> everytime (to update possible dependencies)
ADD source/package.json /opt/package.json

# rm old node_modules
RUN rm -rf /opt/node_modules

# add node modules folder to path and set global node path
ENV NODE_PATH /opt/node_modules
ENV PATH /opt/node_modules/.bin:$PATH

# locally install project dependencies int NODE_PATH (defined above)
RUN cd /opt && npm install

WORKDIR /usr/src/app
