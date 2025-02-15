FROM --platform=linux/x86_64 node:20

RUN apt-get update && apt-get install wget -y
RUN apt-get install -y openssh-server

RUN mkdir -p /tmp/app

WORKDIR /tmp/app
COPY . ./
RUN rm /tmp/app/package-lock.json
RUN rm -rf /tmp/app/node_modules
RUN npm install
RUN npm run build_local
RUN rm -rf /tmp/app/node_modules
RUN npm install --omit=dev

RUN rm -rf /tmp/app/.git
RUN rm -rf /tmp/app/.angular

RUN mkdir /var/run/sshd
RUN echo 'root:root123' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

EXPOSE 22
EXPOSE 8080
EXPOSE 8081

CMD ["sh", "/tmp/app/run.sh"]