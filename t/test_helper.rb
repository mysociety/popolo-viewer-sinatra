# frozen_string_literal: true
require 'minitest/autorun'
require 'vcr'

VCR.configure do |config|
  config.cassette_library_dir = 't/fixtures/vcr_cassettes'
  config.hook_into :webmock
  config.filter_sensitive_data('<GITHUB_ACCESS_TOKEN>') { ENV['GITHUB_ACCESS_TOKEN'] }
end

# FIXME: This should be within a test class, but it needs to be here because
# countries.json is fetched and parsed at boot time in app.rb.
WebMock.stub_request(:get, %r{https://cdn.rawgit.com/everypolitician/everypolitician-data/\w+?/countries.json})
       .to_return(body: File.read('t/fixtures/d8a4682f-countries.json'))

module Minitest
  class Spec
    before do
      VCR.insert_cassette(name)
    end

    after do
      VCR.eject_cassette
    end

    def known_countries_json_url
      'https://cdn.rawgit.com/everypolitician/everypolitician-data/d8a4682f/countries.json'
    end

    def index_at_known_sha
      @index_at_known_sha ||= EveryPolitician::Index.new(index_url: known_countries_json_url)
    end
  end
end
