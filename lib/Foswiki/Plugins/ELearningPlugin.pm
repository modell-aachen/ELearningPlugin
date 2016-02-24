# See bottom of file for default license and copyright information

package Foswiki::Plugins::ELearningPlugin;
use strict;
use warnings;

use Foswiki::AccessControlException ();
use Foswiki::Func    ();
use Foswiki::Plugins ();

use Error qw(:try);
use JSON;

our $VERSION = '1.0';
our $RELEASE = '1.0';
our $SHORTDESCRIPTION = '%$CREATED_SHORTDESCRIPTION%';
our $NO_PREFS_IN_TOPIC = 1;

sub initPlugin {
    my ( $topic, $web, $user, $installWeb ) = @_;

    if ( $Foswiki::Plugins::VERSION < 2.3 ) {
        Foswiki::Func::writeWarning( 'Version mismatch between ',
            __PACKAGE__, ' and Plugins.pm' );
        return 0;
    }

    Foswiki::Func::registerTagHandler( 'QWIKITOUR', \&_QWIKITOUR);

    return 1;
}

sub _QWIKITOUR {
	my($session, $params, $topic, $web, $topicObject) = @_;

	my $output = '';

  my $tourid = $params->{_DEFAULT};
  my $elemid = $tourid;
  $elemid =~ s/[^a-zA-Z0-9]/_/g;
  $elemid =~ s/&/&amp;/g;
  $elemid =~ s/</&lt;/g;
  $elemid =~ s/>/&gt;/g;
  $elemid =~ s/"/&quot;/g;
  my $content_elemid = "tourcontents_$elemid";
  $elemid = "tour_$elemid";
  my $step = $params->{step} || 0;

  my $pref = {
      start => $step,
      steps => "#$content_elemid",
      autoStart => 0,
  };

  Foswiki::Func::addToZone( 'head', 'QWIKITOUR_CSS',
                            '<link rel="stylesheet" href="%PUBURLPATH%/System/ELearningPlugin/plugins/elearning/jquery-qwikitour.css">');

  Foswiki::Func::addToZone( 'script', 'QWIKITOUR', '<script type="text/javascript" src="%PUBURLPATH%/System/ELearningPlugin/plugins/elearning/jquery-qwikitour.js"></script>', 'JQUERYPLUGIN::FOSWIKI');

  my $format = $params->{format} || '<a href="#" id="$id">%MAKETEXT{"Start tour"}%</a>';
  $format =~ s/\$id\b/$elemid/;

  my ($tourWeb, $tourTopic) = Foswiki::Func::normalizeWebTopicName(undef, $tourid);
  my ($tourMeta, $tourText) = Foswiki::Func::readTopic($tourWeb, $tourTopic);

  $pref = to_json($pref);
  my $js = "jQuery(function(\$) { \$('#$elemid').qwikitour($pref); });";
  if ($session->inContext('SafeWikiSignable')) {
      Foswiki::Plugins::SafeWikiPlugin::permitInlineCode($js);
  }
  return "$format<ul id=\"$content_elemid\" class=\"foswikiHidden\">$tourText</ul><script type=\"application/javascript\">$js</script>";
}

1;

__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Copyright (C) 2008-2013 Foswiki Contributors. Foswiki Contributors
are listed in the AUTHORS file in the root of this distribution.
NOTE: Please extend that file, not this notice.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version. For
more details read LICENSE in the root of this distribution.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

As per the GPL, removal of this notice is prohibited.
