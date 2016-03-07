(function () {
	'use-strict';

	angular.module('md1world.video', []).directive('ngMd1Video', ngMd1Video);

	ngMd1Video.$inject = ['$document', '$timeout', '$q', '$templateCache'];

	function ngMd1Video( $document, $timeout, $q, $templateCache ) {

		var defaults = {
			baseClass: 'ng-md1-video',
			thumbClass: 'ng-thumb-video',
			templateUrl: 'ng-md1-video.html'
		};

		var keys_codes = {
			enter: 13,
			esc: 27,
			left: 37,
			right: 39
		};

		function setScopeValues(scope, attrs) {
			scope.baseClass = scope.class || defaults.baseClass;
			scope.thumbClass = scope.thumbClass || defaults.thumbClass;
			scope.thumbsNum = scope.thumbsNum || 3; // should be odd
		}

		var template_url = defaults.templateUrl;
		// Set the default template
		$templateCache.put(template_url,
			'<div class="{{ baseClass }}">' +
			'  <div ng-repeat="i in videos">' +
			'    <img ng-src="" class="{{ thumbClass }}" ng-click="openVideo($index)" alt="Video {{ $index + 1 }}" />' +
			'  </div>' +
			'</div>' +
			'<div class="ng-overlay" ng-show="opened">' +
			'</div>' +
			'<div class="ng-md1-video-content" unselectable="on" ng-show="opened" ng-swipe-left="nextVideo()" ng-swipe-right="prevVideo()">' +
			'  <div class="uil-ring-css" ng-show="loading"><div></div></div>' +
			'<a href="{{getVideoDownloadSrc()}}" target="_blank" ng-show="showVideoDownloadButton()" class="download-video"><i class="fa fa-download"></i></a>' +
			'  <a class="close-popup" ng-click="closeGallery()"><i class="fa fa-close"></i></a>' +
			'  <a class="nav-left" ng-click="prevVideo()"><i class="fa fa-angle-left"></i></a>' +
			'  <video ng-if="url" ondragstart="return false;" draggable="false" class="videoPlayer" preload="metadata" vg-poster="data.poster" > ' +
			' <source ng-src="url" type="video/mp4">' +
			'</video>' +
			'  <a class="nav-right" ng-click="nextVideo()"><i class="fa fa-angle-right"></i></a>' +
			'  <span class="info-text">{{ index + 1 }}/{{ videos.length }} - {{ description }}</span>' +
			'  <div class="ng-thumbnails-wrapper">' +
			'    <div class="ng-thumbnails slide-left">' +
			'      <div ng-repeat="i in videos">' +
			'        <img ng-src="{{ i[config.thumb] }}" ng-class="{\'active\': index === $index}" ng-click="changeVideo($index)" />' +
			'      </div>' +
			'    </div>' +
			'  </div>' +
			'</div>'
		);

		return {
			restrict: 'EA',
			scope: {
				videos: '=',
				thumbsNum: '@',
				config:'='
			},
			templateUrl: function (element, attrs) {
				return attrs.templateUrl || defaults.templateUrl;
			},
			link: function (scope, element, attrs) {
				setScopeValues(scope, attrs);

				if (scope.thumbsNum >= 11) {
					scope.thumbsNum = 11;
				}

				var $body = $document.find('body');
				var $thumbwrapper = angular.element(document.querySelectorAll('.ng-thumbnails-wrapper'));
				var $thumbnails = angular.element(document.querySelectorAll('.ng-thumbnails'));

				scope.index = 0;
				scope.opened = false;

				scope.thumb_wrapper_width = 0;
				scope.thumbs_width = 0;
				/*
				 var loadVideo = function (i) {
				 var deferred = $q.defer();
				 var video = {};

				 video.onload = function () {
				 console.log('onload');
				 scope.loading = false;
				 if (typeof this.complete === false || this.naturalWidth === 0) {
				 deferred.reject();
				 }
				 deferred.resolve(video);
				 };

				 video.onerror = function () {
				 deferred.reject();
				 };

				 video.url = scope.videos[i][scope.config.url]
				 scope.loading = true;

				 return deferred.promise;
				 };
				 */
				var showVideo = function (i) {
					loadVideo(scope.index).then(function (resp) {
						scope.url = resp.url;
						smartScroll(scope.index);
					});
					scope.description = scope.videos[i].description || '';
				};

				scope.showVideoDownloadButton = function () {
					var video = scope.videos[scope.index];
					return angular.isDefined(video.downloadSrc) && 0 < video.downloadSrc.length;
				};

				scope.getVideoDownloadSrc = function () {
					return scope.videos[scope.index].downloadSrc;
				};

				scope.changeVideo = function (i) {
					scope.index = i;
					showVideo(i);
				};

				scope.nextVideo = function () {
					scope.index += 1;
					if (scope.index === scope.videos.length) {
						scope.index = 0;
					}
					showVideo(scope.index);
				};

				scope.prevVideo = function () {
					scope.index -= 1;
					if (scope.index < 0) {
						scope.index = scope.videos.length - 1;
					}
					showVideo(scope.index);
				};

				scope.openVideo = function (i) {
					if (typeof i !== undefined) {
						scope.index = i;
						showVideo(scope.index);
					}
					scope.opened = true;

					$timeout(function () {
						var calculatedWidth = calculateThumbsWidth();
						scope.thumbs_width = calculatedWidth.width;
						$thumbnails.css({width: calculatedWidth.width + 'px'});
						$thumbwrapper.css({width: calculatedWidth.visible_width + 'px'});
						smartScroll(scope.index);
					});
				};

				scope.closeGallery = function () {
					scope.opened = false;
				};

				$body.bind('keydown', function (event) {
					if (!scope.opened) {
						return;
					}
					var which = event.which;
					if (which === keys_codes.esc) {
						scope.closeGallery();
					} else if (which === keys_codes.right || which === keys_codes.enter) {
						scope.nextVideo();
					} else if (which === keys_codes.left) {
						scope.prevVideo();
					}

					scope.$apply();
				});

				var calculateThumbsWidth = function () {
					var width = 0,
						visible_width = 0;
					angular.forEach($thumbnails.find('url'), function (thumb) {
						width += thumb.clientWidth;
						width += 10; // margin-right
						visible_width = thumb.clientWidth + 10;
					});
					return {
						width: width,
						visible_width: visible_width * scope.thumbsNum
					};
				};

				var smartScroll = function (index) {
					$timeout(function () {
						var len = scope.videos.length,
							width = scope.thumbs_width,
							current_scroll = $thumbwrapper[0].scrollLeft,
							item_scroll = parseInt(width / len, 10),
							i = index + 1,
							s = Math.ceil(len / i);

						$thumbwrapper[0].scrollLeft = 0;
						$thumbwrapper[0].scrollLeft = i * item_scroll - (s * item_scroll);
					}, 100);
				};

			}
		};
	}
})();