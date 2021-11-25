# frozen_string_literal: true

require 'test_helper'
require_relative '../../app'

describe 'Country Page' do
  subject { Nokogiri::HTML(last_response.body) }

  describe 'when viewing a country home page' do
    let(:terms) { subject.css('#terms-riigikogu li') }
    before      { get '/estonia/' }

    it 'should know its country' do
      subject.css('.site-header h2').text.strip.must_equal 'Estonia'
    end

    it 'should have the country in the title' do
      subject.css('title').text.must_equal 'EveryPolitician: Estonia'
    end

    it 'should have two terms' do
      terms.count.must_equal 2
    end

    it 'should have start+end dates for the oldest term' do
      terms.css('p').first.text.must_equal '2015-03-30 - '
    end

    it 'should have no end date for the most recent term' do
      terms.css('p').last.text.must_equal '2011-03-27 - 2015-03-23'
    end
  end

  describe 'when displaying download links' do
    let(:links) { subject.css('.button--quarternary/@href') }
    before      { get '/united-states-of-america/' }

    it 'links to the House of Representatives' do
      links.first.text.must_equal '/united-states-of-america/house/download.html'
    end

    it 'links to the Senate' do
      links.last.text.must_equal '/united-states-of-america/senate/download.html'
    end
  end

  describe 'when displaying democratic commons footer' do
    let(:link) { subject.css('.demo-commons-promo') }
    before     { get '/iran/' }

    it 'should link to mySociety Democratic Commons page' do
      link.css('a').last[:href].must_equal 'https://www.mysociety.org/democracy/democratic-commons/'
    end
  end

  describe 'HTML validation' do
    it 'has no errors in the country page' do
      get '/estonia/'
      last_response_must_be_valid
    end
  end
end
