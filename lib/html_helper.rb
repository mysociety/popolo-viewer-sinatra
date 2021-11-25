# frozen_string_literal: true

module HTMLHelper
  def escape_html(text)
    Rack::Utils.escape_html(text)
  end

  def unescape_uri(text)
    CGI.unescape(text)
  end
end
