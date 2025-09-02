#!/bin/bash

echo "Downloading lego..."
curl -L https://github.com/go-acme/lego/releases/download/v4.25.2/lego_v4.25.2_linux_386.tar.gz -o lego.tar.gz | tar -xzvf

echo "Installing lego..."
mv lego /usr/local/bin/lego

echo "Cleaning up..."
rm lego.tar.gz

echo "Lego installed successfully!"

echo "Running lego..."
export LETSENCRYPT_EMAIL=cert_service@omnivoltaic.com
export DOMAIN=sftpgo.omnivoltaic.com
sudo lego --accept-tos --email=${LETSENCRYPT_EMAIL} --domain=${DOMAIN} --path=~/.certs run