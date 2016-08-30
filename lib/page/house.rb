# frozen_string_literal: true

module Page
  class House
    attr_reader :country, :house

    def initialize(house:)
      @house   = house
      @country = house.country
    end

    def legislative_periods
      house.legislative_periods
    end

    def title
      "EveryPolitician: #{country.name} - #{house.name}"
    end
  end
end
