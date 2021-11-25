# frozen_string_literal: true

source 'https://rubygems.org'

ruby '2.4.4'

git_source(:github) { |repo_name| "https://github.com/#{repo_name}.git" }

gem 'dotenv'
gem 'everypolitician', github: 'everypolitician/everypolitician-ruby'
gem 'everypolitician-popolo', github: 'everypolitician/everypolitician-popolo'
gem 'iso_country_codes'
gem 'json'
gem 'nokogiri', '>= 1.6.7'
gem 'octokit'
gem 'puma'
gem 'rack', '~> 1.6.12'
gem 'rake'
gem 'redcarpet', '~> 3.2.3'
gem 'require_all'
gem 'sass'
gem 'sinatra'
gem 'yajl-ruby', require: 'yajl'

group :development do
  gem 'sinatra-contrib'
end

group :test do
  gem 'bundler-audit'
  gem 'html_validation'
  gem 'minitest'
  gem 'pry'
  gem 'rack-test'
  gem 'webmock'
end

group :quality do
  gem 'flog'
  gem 'reek'
  gem 'rubocop'
  gem 'yard'
end
