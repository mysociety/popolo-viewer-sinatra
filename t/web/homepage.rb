# frozen_string_literal: true

require 'test_helper'
require_relative '../../app'

describe 'Homepage' do
  before  { get '/' }
  subject { Nokogiri::HTML(last_response.body) }

  it 'should have the global politician count' do
    subject.css('.hero h1').text.must_include '70,943'
  end

  it 'should have the global country count' do
    subject.css('.hero h1').text.must_include '233 countries'
  end

  it 'should talk about Wikidata' do
    subject.css('.homepage-data-example').text.must_include 'Wikidata'
  end

  it 'should offer the whole world in the dropdown' do
    subject.css('#country-selector option').count.must_equal 246
  end

  it 'should sum the people in Colombia' do
    colombia = subject.css('#country-selector option[value=colombia]/@title')
    colombia.text.must_equal '269 people'
  end

  it 'should have no people in Eritrea' do
    colombia = subject.css('#country-selector option[value=eritrea]/@title')
    colombia.text.must_equal '0 people'
  end
end
