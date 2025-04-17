FROM alpine:latest

RUN apk add --no-cache pgbouncer

RUN mkdir -p /etc/pgbouncer /var/run/pgbouncer \
    && chown -R nobody:nobody /etc/pgbouncer /var/run/pgbouncer

USER nobody

EXPOSE 6432

CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]

