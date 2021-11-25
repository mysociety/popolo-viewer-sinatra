# frozen_string_literal: true

require 'test_helper'
require_relative '../../../app'

describe 'Northern Ireland' do
  subject { Nokogiri::HTML(last_response.body) }
  let(:memtable)  { subject.css('div.grid-list') }
  let(:annalo)    { subject.css('#mem-39093c42-e2ef-4fc1-805f-e1eb9167111d') }
  let(:mcquillan) { subject.css('#mem-1074213b-e6f1-4427-bb85-176ab389a305') }
  let(:ross)      { subject.css('#mem-c42dfdb8-647d-40db-98ce-894ca19b6aec') }
  let(:simpson)   { subject.css('#mem-62479dcd-b981-4a57-8a11-b8f8b17249fb') }

  describe 'membership dates' do
    before do
      stub_term_table('1a17862', 'Northern_Ireland/Assembly')
      get '/northern-ireland/assembly/term-table/3.html'
    end

    it 'should have no dates for Adrian McQuillan' do
      mcquillan.last.text.wont_include '20'
    end

    it 'should have a start date for Alastair Ross' do
      ross.last.text.must_include '2007-05-14'
      ross.last.text.wont_include '2011-03-24'
    end

    it 'should have an end date for David Simpson' do
      simpson.last.text.wont_include '2007-03-09'
      simpson.last.text.must_include '2010-07-01'
    end

    it 'should start with a placeholder image, but have proxy set' do
      img = annalo.css('img.person-card__image')[0]
      img.attr('src').must_equal '/images/person-placeholder-108px.png'
      img.attr('data-src').must_include 'politician-image-proxy'
    end

    it 'should have an image if JavaScript is disabled' do
      img = annalo.css('img.person-card__image')[1]
      img.attr('src').must_include 'politician-image-proxy'
      img.attr('data-src').must_be_nil
    end

    it 'has only a placeholder image if the person has no image' do
      img = mcquillan.css('img.person-card__image')
      img.size.must_equal 1
      img.attr('src').text.must_equal '/images/person-placeholder-108px.png'
    end
  end
end
