# frozen_string_literal: true
require 'test_helper'

describe 'Everypolitician::LegislatureExtension' do
  describe 'accessing positions data' do
    before do
      stub_popolo('f88ce37', 'Estonia/Riigikogu')
      stub_everypolitician_data_request('f88ce37/data/Estonia/Riigikogu/unstable/positions.csv')
    end

    let(:riigikogu) { index_at_known_sha.country('estonia').legislature('riigikogu') }

    subject { riigikogu.positions.find { |p| p.id == 'e28a42b5-395d-4993-9025-f5b417edd583' } }

    it 'returns the expected number of positions' do
      riigikogu.positions.size.must_equal 110
    end

    it 'returns Position instances' do
      subject.name.must_equal 'Andres Anvelt'
      subject.position.must_equal 'Minister of Justice'
      subject.start_date.must_equal Date.new(2014, 3, 26)
      subject.end_date.must_equal Date.new(2015, 4, 9)
    end
  end
end
