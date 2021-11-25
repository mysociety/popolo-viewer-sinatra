# frozen_string_literal: true

require 'test_helper'
require_relative '../../../app'

describe 'Bahamas' do
  subject      { Nokogiri::HTML(last_response.body) }
  let(:hubert) { subject.css('#mem-4a7bfd46-3b03-46ec-957f-3ef526b04bbe') }
  let(:damian) { subject.css('#mem-58709524-7f66-44fd-8315-9712c4655768') }
  let(:philip) { subject.css('#mem-dcd1a356-a7e6-409b-8028-27fea2691105') }

  before do
    stub_term_table('4da60b8', 'Bahamas/House_of_Assembly')
    get '/bahamas/house-of-assembly/term-table/2012.html'
  end

  describe 'source urls' do
    let(:sources) { subject.css('.source-credits p:first-child') }

    it 'links to a valid url' do
      sources.css('a').last.text.must_include '/Members of Parliament/'
    end

    it 'displays an unescaped url' do
      sources.css('a/@href').last.text.must_include '/Members+of+Parliament/'
    end
  end

  describe 'alt attribute on avatars' do
    it 'has the person name in a normal image' do
      img = hubert.css('img.person-card__image')[0]
      img.attr('alt').must_equal 'Member headshot for Hubert Chipman'
    end

    it 'has the person name in a normal image when JS is disabled' do
      img = hubert.css('img.person-card__image')[1]
      img.attr('alt').must_equal 'Member headshot for Hubert Chipman'
    end

    it 'has the person name in a placeholder image' do
      img = damian.css('img.person-card__image')
      img.attr('alt').text.must_equal 'Placeholder image for Damian Gomez'
    end

    it 'doesnt break for names with double quotes' do
      img = philip.css('img.person-card__image')[0]
      img.attr('alt').must_equal 'Member headshot for Philip "Brave" Davis'
    end
  end

  describe 'HTML validation' do
    it 'has no errors in the term-table page' do
      last_response_must_be_valid
    end
  end
end
