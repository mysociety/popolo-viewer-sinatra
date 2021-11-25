# frozen_string_literal: true

require 'test_helper'
require_relative '../../app'

describe 'House Page' do
  subject { Nokogiri::HTML(last_response.body) }
  before { get '/united-states-of-america/senate/' }

  describe 'list of terms' do
    it 'displays all terms' do
      subject.css('.avatar-unit').count.must_equal 18
    end

    it 'displays the last term name' do
      subject.css('.avatar-unit h3').first.text.must_equal '114th Congress'
    end

    it 'displays the first term dates' do
      subject.css('.avatar-unit p').last.text.must_equal '1981-01-06 - 1983-01-03'
    end
  end

  describe 'when displaying democratic commons footer' do
    let(:link) { subject.css('.demo-commons-promo') }
    before     { get '/australia/representatives/' }

    it 'should link to mySociety Democratic Commons page' do
      link.css('a').last[:href].must_equal 'https://www.mysociety.org/democracy/democratic-commons/'
    end
  end

  describe 'HTML validation' do
    it 'has no errors in the house page' do
      last_response_must_be_valid
    end
  end
end
