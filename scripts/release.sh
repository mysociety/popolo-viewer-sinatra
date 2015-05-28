#!/bin/bash

set -eo pipefail

[[ "$TRACE" ]] && set -x

if [[ "$TRAVIS_PULL_REQUEST" == "false" && "$TRAVIS_BRANCH" == "master" ]]; then
  openssl aes-256-cbc -K $encrypted_ab0690a1b9d7_key -iv $encrypted_ab0690a1b9d7_iv -in deploy_key.pem.enc -out deploy_key.pem -d
  chmod 600 deploy_key.pem
  eval "$(ssh-agent)"
  ssh-add deploy_key.pem

  bundle exec ruby app.rb &
  while ! nc -z localhost 4567; do sleep 1; done
  cd /tmp
  wget -m localhost:4567
  git clone "git@github.com:everypolitician/viewer-static.git"
  cd everypolitician-data
  git checkout gh-pages
  cp -R ../localhost:4567/* .
  git add .
  git -c "user.name=everypoliticianbot" -c "user.email=everypoliticianbot@users.noreply.github.com" commit -m "Automated commit"
  git push origin gh-pages
fi
