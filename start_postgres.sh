#!/bin/bash
# Démarrer PostgreSQL manuellement
mkdir -p /var/run/postgresql
chown -R root:root /var/run/postgresql
/usr/lib/postgresql/*/bin/postgres -D /var/lib/postgresql/*/main -c config_file=/etc/postgresql/*/main/postgresql.conf
