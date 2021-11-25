# frozen_string_literal: true

require 'everypolitician'
require 'open-uri'
require 'fileutils'

module EveryPolitician
  module CountryExtension
    def person_count
      legislatures.map(&:person_count).inject(:+)
    end
  end

  module LegislatureExtension
    class Position
      def initialize(row)
        @row = row
      end

      def id
        row[:id]
      end

      def name
        row[:name]
      end

      def position
        row[:position]
      end

      def start_date
        parse_date(row[:start_date])
      end

      def end_date
        parse_date(row[:end_date])
      end

      def type
        row[:type]
      end

      private

      attr_reader :row

      def parse_date(date)
        Date.new(*date.split('-').map(&:to_i))
      end
    end

    class Positions
      def initialize(csv_url:)
        @csv_url = csv_url
      end

      def positions
        csv.map { |row| Position.new(row) }
      end

      private

      attr_reader :csv_url

      def csv
        CSV.parse(
          csv_data,
          converters:        nil,
          headers:           true,
          header_converters: :symbol
        )
      end

      def csv_data
        @csv_data ||= open(csv_url).read
      end
    end

    # UK.legislature('Commons').term(65)
    def term(termid)
      after, current, before = [nil, legislative_periods, nil]
                               .flatten
                               .each_cons(3)
                               .find do |_, term, _|
        term.id.split('/').last == termid.to_s
      end
      current.define_singleton_method(:prev) { before }
      current.define_singleton_method(:next) { after }
      current
    end

    def positions
      @positions ||= Positions.new(csv_url: positions_csv_url).positions
    end

    private

    def positions_csv_url
      names_url.gsub(/names\.csv$/, 'unstable/positions.csv')
    end
  end

  module LegislativePeriodExtension
    def memberships
      @memberships ||= legislature.popolo.memberships.select do |mem|
        mem.legislative_period_id == id
      end
    end

    def memberships_at_end
      memberships.select do |mem|
        mem.end_date.to_s.empty? || mem.end_date == end_date
      end
    end

    def people
      @people ||= memberships.map(&:person).uniq(&:id)
    end

    def identifier_map
      @identifier_map ||= people.select(&:identifiers).map { |p| p.identifiers.map { |i| i.merge(id: p.id) } }.flatten
    end

    def top_identifiers
      @top_identifiers ||= identifier_map.reject { |i| i[:scheme] == 'everypolitician_legacy' }
                                         .group_by { |i| i[:scheme] }
                                         .sort_by { |s, ids| [-ids.size, s] }
                                         .map { |s, _ids| s }
    end
  end
end

EveryPolitician::Country.include EveryPolitician::CountryExtension
EveryPolitician::Legislature.include EveryPolitician::LegislatureExtension
EveryPolitician::LegislativePeriod.include EveryPolitician::LegislativePeriodExtension
